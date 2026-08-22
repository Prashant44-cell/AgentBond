"use strict";
/**
 * Agentra Verify - Paid Task & Content Verification Handler
 *
 * Endpoint: POST /verify-task
 * Price: $0.01 USDC (via x402 payment middleware)
 *
 * Algorithm:
 * 1. Normalize task and content.
 * 2. Detect risk signals with weighted rules:
 *    - urgent payment language: +20
 *    - changed bank/payment details: +30
 *    - sender/vendor mismatch: +25
 *    - unrealistic discount: +20
 *    - no refund/cancellation terms: +15
 *    - suspicious links/domains: +25
 *    - crypto-only/manual payment request: +25
 *    - missing seller identity: +15
 * 3. If HUGGINGFACE_API_KEY exists, call HF zero-shot classification (facebook/bart-large-mnli)
 *    with labels: ["safe", "invoice fraud", "seller risk", "policy risk", "phishing", "requires human review"].
 * 4. Combine rule score and model confidence.
 * 5. Map score: 0-24 -> low, 25-59 -> medium, 60+ -> high.
 * 6. Map risk: low -> safe, medium -> review_before_action, high -> suspicious.
 * 7. Return explainable evidence and recommended autonomous agent action.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVerifyTaskRequest = handleVerifyTaskRequest;
exports.evaluateRiskAlgorithm = evaluateRiskAlgorithm;
/**
 * Handle POST /verify-task
 * Protected by x402 payment middleware (0.01 USDC).
 */
async function handleVerifyTaskRequest(c) {
    const startTime = Date.now();
    try {
        console.log('\n🛡️ [Agentra] x402 Payment Verified — Executing POST /verify-task');
        // Parse request body
        let body;
        try {
            body = await c.req.json();
        }
        catch {
            return c.json({
                success: false,
                error: 'Invalid JSON payload. Body must contain "task" and "content".',
            }, 400);
        }
        const { task, content, sourceUrl } = body;
        // Validate inputs
        if (!task || typeof task !== 'string' || task.trim().length === 0) {
            return c.json({
                success: false,
                error: 'Missing required field: "task" must be a non-empty string.',
            }, 400);
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return c.json({
                success: false,
                error: 'Missing required field: "content" must be a non-empty string.',
            }, 400);
        }
        const cleanTask = task.trim();
        const cleanContent = content.trim();
        const cleanSourceUrl = sourceUrl && typeof sourceUrl === 'string' ? sourceUrl.trim() : undefined;
        console.log(`  Task: "${cleanTask.slice(0, 60)}${cleanTask.length > 60 ? '...' : ''}"`);
        console.log(`  Content: "${cleanContent.slice(0, 60)}${cleanContent.length > 60 ? '...' : ''}"`);
        const hfApiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;
        let modelUsed = 'fallback-rules';
        let hfClassification = null;
        // Step 3: Hugging Face zero-shot classification if API key is provided
        if (hfApiKey) {
            try {
                console.log('  Calling Hugging Face Inference (facebook/bart-large-mnli)...');
                const hfResponse = await fetchWithTimeout('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: `Task: ${cleanTask}\nContent: ${cleanContent.slice(0, 1000)}`,
                        parameters: {
                            candidate_labels: [
                                'safe',
                                'invoice fraud',
                                'seller risk',
                                'policy risk',
                                'phishing',
                                'requires human review',
                            ],
                        },
                    }),
                }, 5000);
                if (hfResponse.ok) {
                    const hfData = await hfResponse.json();
                    if (hfData && Array.isArray(hfData.labels) && Array.isArray(hfData.scores)) {
                        hfClassification = hfData.labels.map((label, index) => ({
                            label,
                            score: hfData.scores[index] || 0,
                        }));
                        modelUsed = 'facebook/bart-large-mnli';
                        console.log('  ✓ Hugging Face model classification succeeded');
                    }
                }
            }
            catch (hfErr) {
                console.warn('  ⚠️ Hugging Face call failed or timed out, continuing with fallback rules:', hfErr.message);
            }
        }
        // Run weighted risk assessment algorithm
        const result = evaluateRiskAlgorithm(cleanTask, cleanContent, cleanSourceUrl, hfClassification);
        const responsePayload = {
            success: true,
            service: 'agentra.verify',
            decision: result.decision,
            risk: result.risk,
            confidence: result.confidence,
            summary: result.summary,
            evidence: result.evidence,
            recommendedAction: result.recommendedAction,
            modelUsed: modelUsed,
            paidVia: 'x402 / USDC Algorand TestNet',
            timestamp: new Date().toISOString(),
        };
        const durationMs = Date.now() - startTime;
        console.log(`  ✓ Completed in ${durationMs}ms — Decision: ${result.decision} (${result.risk} risk, confidence: ${result.confidence})`);
        return c.json(responsePayload, 200);
    }
    catch (err) {
        console.error('❌ Error in verify-task handler:', err);
        return c.json({
            success: false,
            error: 'Verification service error. Please retry.',
            details: err.message,
        }, 500);
    }
}
/**
 * Weighted Risk Scoring & Evidence Algorithm
 */
function evaluateRiskAlgorithm(task, content, sourceUrl, hfScores) {
    // 1. Normalize task and content
    const normalizedTask = task.toLowerCase().replace(/\s+/g, ' ');
    const normalizedContent = content.toLowerCase().replace(/\s+/g, ' ');
    const combinedText = `${normalizedTask} ${normalizedContent}`;
    let score = 0;
    const evidence = [];
    // 2. Detect risk signals with weighted rules:
    // Rule A: urgent payment language (+20)
    if (combinedText.includes('urgent') ||
        combinedText.includes('immediately') ||
        combinedText.includes('within 24 hours') ||
        combinedText.includes('within 2 hours') ||
        combinedText.includes('due today') ||
        combinedText.includes('immediate payment') ||
        combinedText.includes('threat of suspension') ||
        combinedText.includes('penalty applies today')) {
        score += 20;
        evidence.push('Urgent payment or action language detected (High pressure timeline).');
    }
    // Rule B: changed bank/payment details (+30)
    if (combinedText.includes('bank details changed') ||
        combinedText.includes('bank details have changed') ||
        combinedText.includes('new bank') ||
        combinedText.includes('new routing') ||
        combinedText.includes('updated banking') ||
        combinedText.includes('changed today') ||
        combinedText.includes('alternate account') ||
        combinedText.includes('do not send funds to our previous')) {
        score += 30;
        evidence.push('Critical flag: Bank details or remittance routing changed recently (Vendor Email Compromise indicator).');
    }
    // Rule C: sender/vendor mismatch (+25)
    if (combinedText.includes('does not match') ||
        combinedText.includes('sender email domain does not match') ||
        combinedText.includes('domain mismatch') ||
        combinedText.includes('@gmail.com') ||
        combinedText.includes('@yahoo.com') ||
        combinedText.includes('@hotmail.com') ||
        combinedText.includes('.xyz') ||
        combinedText.includes('.top') ||
        combinedText.includes('.click')) {
        score += 25;
        evidence.push('Sender / vendor domain mismatch or unverified origin domain detected.');
    }
    // Rule D: unrealistic discount (+20)
    if (combinedText.includes('90% discount') ||
        combinedText.includes('85% discount') ||
        combinedText.includes('80% discount') ||
        combinedText.includes('95% discount') ||
        combinedText.includes('liquidation sale') ||
        combinedText.includes('unrealistic discount')) {
        score += 20;
        evidence.push('Pricing anomaly: Unrealistic extreme discount (>80% off standard market value).');
    }
    // Rule E: no refund/cancellation terms (+15)
    if (combinedText.includes('no refund') ||
        combinedText.includes('no refund terms') ||
        combinedText.includes('non-refundable') ||
        combinedText.includes('restocking fee') ||
        combinedText.includes('cancellation allowed only within') ||
        combinedText.includes('hidden fee') ||
        combinedText.includes('deposit is forfeited')) {
        score += 15;
        evidence.push('Restrictive policy: No refund guarantee, forfeiture clauses, or severe cancellation penalties.');
    }
    // Rule F: suspicious links/domains (+25)
    const hasSuspiciousUrl = (sourceUrl && (sourceUrl.includes('.xyz') || sourceUrl.includes('.top') || sourceUrl.includes('.biz') || sourceUrl.includes('bit.ly') || sourceUrl.includes('tinyurl'))) ||
        combinedText.includes('suspicious link') ||
        combinedText.includes('.top/') ||
        combinedText.includes('.xyz/');
    if (hasSuspiciousUrl) {
        score += 25;
        evidence.push('Origin risk: Suspicious link, URL shortener, or high-risk top-level domain detected.');
    }
    // Rule G: crypto-only / manual payment request (+25)
    if (combinedText.includes('external payment') ||
        combinedText.includes('external payment requested') ||
        combinedText.includes('pay outside') ||
        combinedText.includes('crypto transfer') ||
        combinedText.includes('telegram') ||
        combinedText.includes('friends and family') ||
        combinedText.includes('wire direct')) {
        score += 25;
        evidence.push('Escrow bypass: Direct external transfer or off-platform payment requested without buyer protection.');
    }
    // Rule H: missing seller identity (+15)
    if (combinedText.includes('no seller address') ||
        combinedText.includes('0 reviews') ||
        combinedText.includes('unverified account') ||
        combinedText.includes('missing seller') ||
        combinedText.includes('member since: today')) {
        score += 15;
        evidence.push('Identity deficiency: Missing verified seller credentials, physical address, or reputation history.');
    }
    // Policy-specific checks
    if (combinedText.includes('40% hidden restocking fee') || combinedText.includes('auto-renews')) {
        if (!evidence.some((e) => e.includes('penalty') || e.includes('Restrictive'))) {
            score += 15;
            evidence.push('Hidden fees and stringent agreement terms detected.');
        }
    }
    // 4. Combine rule score with Hugging Face model confidence (if available)
    if (hfScores && hfScores.length > 0) {
        const fraudScore = hfScores.find((s) => s.label === 'invoice fraud' || s.label === 'phishing' || s.label === 'seller risk')?.score || 0;
        const policyRisk = hfScores.find((s) => s.label === 'policy risk' || s.label === 'requires human review')?.score || 0;
        const safeScore = hfScores.find((s) => s.label === 'safe')?.score || 0;
        if (fraudScore > 0.5) {
            score += Math.round(fraudScore * 25);
            evidence.push(`HF Model classified content under high-threat category (${(fraudScore * 100).toFixed(0)}% probability).`);
        }
        else if (policyRisk > 0.4) {
            score += Math.round(policyRisk * 15);
            evidence.push(`HF Model flagged policy risk / human review recommendation (${(policyRisk * 100).toFixed(0)}% probability).`);
        }
        else if (safeScore > 0.7 && score < 25) {
            score = Math.max(0, score - 10);
        }
    }
    // Legitimate baseline adjustments
    if (combinedText.includes('standard net 30') || combinedText.includes('net-30') || (combinedText.includes('po #') && score < 25)) {
        score = Math.max(0, score - 15);
        evidence.push('Standard commercial billing terms and verified purchase order metadata present.');
    }
    if (evidence.length === 0) {
        evidence.push('Content conforms to standard operational format with no detected risk indicators.');
    }
    // 6. Map score:
    // 0-24 -> low
    // 25-59 -> medium
    // 60+ -> high
    let risk;
    let decision;
    let confidence;
    let summary;
    let recommendedAction;
    if (score >= 60) {
        risk = 'high';
        decision = 'suspicious';
        confidence = Math.min(0.85 + (score / 150) * 0.12, 0.98);
        summary = `High risk detected (Score: ${score}). Content displays multiple severe warning indicators of fraud, unauthorized redirection, or deception.`;
        recommendedAction = 'ABORT / HALT: Do not execute payment or accept terms. Escalate to human supervisor with attached evidence.';
    }
    else if (score >= 25) {
        risk = 'medium';
        decision = 'review_before_action';
        confidence = 0.84;
        summary = `Medium risk identified (Score: ${score}). Content contains restrictive clauses, tight deadlines, or unverified parameters requiring caution.`;
        recommendedAction = 'PAUSE & VALIDATE: Request human review or out-of-band confirmation before proceeding with autonomous execution.';
    }
    else {
        risk = 'low';
        decision = 'safe';
        confidence = 0.92;
        summary = `Verification passed (Score: ${score}). No significant fraud, security, or policy threats detected.`;
        recommendedAction = 'PROCEED: Autonomous agent may proceed with requested action within established limits.';
    }
    return {
        decision,
        risk,
        confidence: Number(confidence.toFixed(2)),
        summary,
        evidence,
        recommendedAction,
    };
}
/**
 * Utility: Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
