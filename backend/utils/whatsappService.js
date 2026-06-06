/**
 * whatsappService.js
 * ─────────────────
 * Thin WhatsApp notification helper.
 *
 * Currently uses a simple HTTP gateway approach (CallMeBot / WA Business API).
 * Swap `sendRaw()` for your live gateway when available.
 *
 * Exports:
 *   sendLowBalanceAlert(memberId, newBalance, pool)
 */

const sql = require("mssql");

// ── Low-balance threshold config ───────────────────────────────────────────
const LOW_BALANCE_THRESHOLD_PCT = 0.10; // 10 % of CreditLimit (fallback)
const LOW_BALANCE_THRESHOLD_FIXED = 100; // fixed amount used when CreditLimit = 0

/**
 * Compute the low-balance threshold for a member.
 * @param {number} creditLimit
 * @returns {number}
 */
function computeThreshold(creditLimit) {
  return creditLimit > 0
    ? creditLimit * LOW_BALANCE_THRESHOLD_PCT
    : LOW_BALANCE_THRESHOLD_FIXED;
}

/**
 * sendRaw – fire-and-forget wrapper.
 * Replace the body of this function with your actual WhatsApp gateway call
 * (e.g., Twilio, CallMeBot, WABA Cloud API, etc.)
 *
 * @param {string} phone  – E.164-ish number, digits only
 * @param {string} message
 */
async function sendRaw(phone, message) {
  // ── STUB: log to console until a real gateway is configured ──────────────
  console.log(`[WhatsApp] TO: ${phone} | MSG: ${message}`);

  // ── Example: CallMeBot (uncomment and set CALLMEBOT_API_KEY in .env) ────
  // const apiKey = process.env.CALLMEBOT_API_KEY;
  // if (!apiKey) return;
  // const encoded = encodeURIComponent(message);
  // const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
  // const fetch = (await import("node-fetch")).default;
  // await fetch(url);
}

/**
 * sendLowBalanceAlert
 * ───────────────────
 * Looks up the member's Name, Phone and CreditLimit, then sends a single
 * low-balance WhatsApp notification.
 *
 * @param {string}     memberId   – GUID
 * @param {number}     newBalance – CurrentBalance after deduction
 * @param {object}     pool       – mssql connection pool
 */
async function sendLowBalanceAlert(memberId, newBalance, pool) {
  try {
    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, memberId)
      .query("SELECT Name, Phone, CreditLimit FROM MemberMaster WHERE MemberId = @Id");

    if (!result.recordset || result.recordset.length === 0) {
      console.warn(`[WhatsApp] Member ${memberId} not found – alert skipped.`);
      return;
    }

    const { Name, Phone, CreditLimit } = result.recordset[0];
    if (!Phone) {
      console.warn(`[WhatsApp] Member ${Name} has no phone – alert skipped.`);
      return;
    }

    const threshold = computeThreshold(Number(CreditLimit) || 0);
    const balance   = Number(newBalance).toFixed(2);
    const message   =
      `Dear ${Name}, your prepaid balance is low (RM ${balance}). ` +
      `Please recharge to continue ordering. Thank you! 🙏`;

    await sendRaw(Phone, message);
    console.log(`✅ [WhatsApp] Low-balance alert sent to ${Name} (${Phone}), balance=RM ${balance}`);
  } catch (err) {
    // Non-fatal — log and swallow so the sale flow is not interrupted
    console.error("[WhatsApp] sendLowBalanceAlert error:", err.message);
  }
}

module.exports = { sendLowBalanceAlert, computeThreshold };
