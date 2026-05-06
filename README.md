# Real Estate WhatsApp Bot (Phase 1)

This is the initial design phase of a WhatsApp chatbot for real estate.

## What is included:
- Conversation flow (flow.txt)
- Sample property data (data.txt)
- Bot behavior/personality (persona.txt)

## Purpose:
To simulate a smart assistant that helps clients find apartments for sale in Kuwait.

## Current status:
- Prototype (no backend yet)
- No WhatsApp integration yet

## Next phase:
- Add smart logic
- Build backend
- Connect to WhatsApp API

---

## Phase 2: Smart Logic Layer

This phase adds intelligent message processing and property matching capabilities.

### New Files Added:
- `logic.js` - Main smart logic for message analysis, state management, and response generation
- `matcher.js` - Property matching engine that scores and selects the best apartment based on user preferences
- `parser.js` - Arabic text parsing helpers for detecting intent, budget, rooms, and area preferences
- `demo.js` - Terminal-based demo to simulate a full user conversation

### How the Logic Works:
- **Message Analysis**: Parses Arabic user messages to extract intent (buy/investment), budget level (low/medium/high), number of rooms, and preferred area
- **Property Matching**: Uses a scoring system to find the best property match from sample data, prioritizing area, rooms, budget fit, and intent
- **Conversation Flow**: Maintains simple state management to guide users through questions and provide recommendations
- **Response Generation**: Generates professional Arabic replies that feel natural and sales-oriented

### Running the Demo:
To test the smart logic locally, run:
```
node demo.js
```
This will simulate a sample conversation and show how the bot processes messages and matches properties.

### Current Status:
- Smart logic implemented without external APIs
- Deterministic and reliable matching
- Still prototype (no WhatsApp integration or backend)
- Ready for Phase 3 backend development

---

## Phase 3: WhatsApp Bot

This phase connects the smart logic to WhatsApp using `whatsapp-web.js` and `qrcode-terminal`.

### What is included:
- `whatsapp.js` - WhatsApp bot entry point with LocalAuth and per-user in-memory state
- `package.json` - project script and dependencies for WhatsApp testing

### How to run:
1. تثبت الحزم:
```bash
npm install
```
2. تشغل البوت:
```bash
npm start
```
3. امسح رمز الـ QR باستخدام واتساب على هاتفك
4. ارسل رسالة إلى الرقم المرتبط وستصل الردود بالعربية المهنية

### What to expect:
- ردود قصيرة وواثقة
- تنسيق نظيف مع رموز تعبيرية `📍 🏠 💰 📐`
- توصيات فورية عند توفر معلومات كافية
- سؤال واحد فقط عند الحاجة لمعلومات إضافية

### Notes:
- هذه نسخة عرض حي (demo) للاستخدام المحلي
- لا يوجد تخزين بيانات خارجي بعد
- كل حالة مستخدم تحفظ في الذاكرة فقط