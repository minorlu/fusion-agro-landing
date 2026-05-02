require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(helmet());

if (process.env.ALLOWED_ORIGIN) {
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGIN,
      methods: ["POST"],
    })
  );
}

app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Слишком много заявок. Попробуйте позже.",
  },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  return {
    digits,
    formatted: digits ? `+${digits}` : "",
  };
}

function validateForm(body) {
  const name = getString(body.name);
  const phoneRaw = getString(body.phone);
  const email = getString(body.email);
  const message = getString(body.message);
  const website = getString(body.website);
  const formStartedAt = Number(body.formStartedAt);

  const errors = [];

  if (website) {
    return {
      isBot: true,
      errors: [],
    };
  }

  if (!formStartedAt || Date.now() - formStartedAt < 3000) {
    errors.push("Форма отправлена слишком быстро.");
  }

  if (name.length < 2 || name.length > 80) {
    errors.push("Введите корректное имя.");
  }

  const phone = normalizePhone(phoneRaw);

  if (!/^7\d{10}$/.test(phone.digits)) {
    errors.push("Введите корректный номер телефона в формате +7.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) {
    errors.push("Введите корректный email.");
  }

  if (message.length > 1000) {
    errors.push("Сообщение слишком длинное.");
  }

  const linksCount = (message.match(/https?:\/\/|www\./gi) || []).length;

  if (linksCount > 2) {
    errors.push("Слишком много ссылок в сообщении.");
  }

  return {
    isBot: false,
    errors,
    data: {
      name,
      phone: phone.formatted,
      email,
      message,
    },
  };
}

app.post("/api/contact", contactLimiter, async (req, res) => {
  try {
    const result = validateForm(req.body);

    // Honeypot: делаем вид, что все успешно, но письмо не отправляем
    if (result.isBot) {
      return res.status(200).json({ ok: true });
    }

    if (result.errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: result.errors[0],
      });
    }

    const { name, phone, email, message } = result.data;

    const safeName = escapeHtml(name);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email || "Не указан");
    const safeMessage = escapeHtml(message || "Не указано");

    await transporter.sendMail({
      from: `"Заявка с сайта" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_TO,
      replyTo: email || undefined,
      subject: `Новая заявка с сайта от ${name}`,
      text: `
Новая заявка с сайта

Имя: ${name}
Телефон: ${phone}
Email: ${email || "Не указан"}

Сообщение:
${message || "Не указано"}
      `,
      html: `
        <h2>Новая заявка с сайта</h2>
        <p><strong>Имя:</strong> ${safeName}</p>
        <p><strong>Телефон:</strong> ${safePhone}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Сообщение:</strong></p>
        <p>${safeMessage.replaceAll("\n", "<br>")}</p>
      `,
    });

    return res.status(200).json({
      ok: true,
      message: "Заявка отправлена.",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return res.status(500).json({
      ok: false,
      message: "Ошибка сервера. Попробуйте позже.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});