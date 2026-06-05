# GemAI - AI-Powered Gemstone & Jewellery Product Photography (v2.0)

GemAI is a single-page web application specifically designed for gemstone and jewellery sellers in India. By uploading a single gemstone or jewellery photo and picking a design style, sellers can instantly generate a high-end catalogue-grade marketing image. 

The application utilizes **OpenAI's GPT Image 1 (`gpt-image-1` edit API)**, which contextually modifies the background, lighting, and surroundings while preserving the original shape, facet structure, and color details of the gemstone or ring.

---

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express + Multer + Sharp (for square PNG conversion)
- **APIs**:
  - **OpenAI** GPT Image 1 (`gpt-image-1` edit API)
  - **Cloudinary** for image storage (Account: `deijlb7dp`)

---

## Output Categories
1. **Gemstone Styles (6 templates)**:
   - *Emerald Luxury* (default)
   - *Black Velvet*
   - *Macro Detail*
   - *Golden Hour*
   - *Vogue Marble*
   - *Nature Flat Lay*
2. **Ring on Model (3 templates)**:
   - *Portrait Cover*
   - *Hand Close-Up*
   - *Editorial Glove*

---

## Getting Started

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-...
   CLOUDINARY_CLOUD_NAME=deijlb7dp
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```
   *Note: If the OpenAI key is missing or set to placeholder text, the backend automatically runs in **Mock Mode**, returning the template's official preview image as the output render.*
4. Start the server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3001`.

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure frontend variables in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or `http://localhost:5174` if port 5173 is in use).

---

## Mock Mode Validation
To test the flow without spending OpenAI credits:
1. Ensure `OPENAI_API_KEY=sk-...` or is left undefined.
2. Select any template tile, upload an image, and click "Generate AI Image".
3. The page will scroll to the results section, displaying a loading skeleton card with cycling status messages for 1.5 seconds.
4. The cropped/resized preview image for the chosen template is returned as a base64 data URL.
5. Click "Clear State" or "Try another style" to reset.

---

## OpenAI Dashboard & Cost Protection Settings

To ensure the $5 MVP budget is strictly respected and prevent unexpected overspending:

### 1. Manual OpenAI Project Dashboard Limits
Log in to your [OpenAI Platform Dashboard](https://platform.openai.com/) and configure the following:
- **Project Limits**: Create a dedicated project for Auralux AI MVP and set a hard budget limit of **$5.00**.
- **Alert Thresholds**: Set email alert notifications at **50% ($2.50)**, **80% ($4.00)**, and **100% ($5.00)** of the budget.
- **Dedicated Keys**: Issue a dedicated API key solely for this MVP. If the key is ever exposed, rotate it immediately in the OpenAI dashboard and update the environment variable.

### 2. Cost Projection Target
- **Target Budget**: $5.00
- **Target Image Count**: 200 generations
- **Projected Unit Cost**: $5.00 / 200 images = **$0.025 per image**

> [!WARNING]
> If current OpenAI image model pricing (e.g. DALL-E 2 / gpt-image-1) exceeds this target or rises, adjust `OPENAI_MAX_GENERATIONS` downwards in the environment variables (e.g., to 150 or 100 generations) to remain strictly under the $5 budget limit.

