<<<<<<< HEAD
# NEX PDF

NEX PDF is a responsive browser-based document workspace branded by NEXORA. This repository currently implements the **Stage 1 frontend preview**. It is not a production document platform: it has no authentication, database, private cloud storage, background workers, billing, or administrator service.

## Run locally

Requirements: Node.js 20+ and npm.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production frontend build:

```powershell
npm run build
npm run preview
```

No environment variables or database migrations are required by this browser-only preview.

## Working in this preview

The following tools use `pdf-lib` and run in the browser. Selected files are not uploaded:

- Merge PDF (selected order)
- Split PDF (one PDF per page, downloaded as a ZIP)
- Rotate PDF (all pages by 90 degrees)
- Organize, extract, and delete pages (page numbers are 1-based)
- Add text watermarks and page numbers
- JPG/PNG images to PDF

Other PDF and office conversions, editing, encryption, password removal, PDF compression, NEX MB Compressor, and NEX File Transfer are explicitly unavailable until their processing services are implemented. The 50 GB and 200 GB figures shown in the UI are target limits only; they are not enforced by this frontend. Do not use this preview to upload sensitive files or as a substitute for secure cloud processing.

The ChatGPT action opens `https://chatgpt.com/` in a new tab. It does not collect ChatGPT credentials or connect an OpenAI API account.

## Production implementation still required

Before enabling server-dependent tools, add and configure:

- An API with secure sign-up/login, verification, reset, session controls, role-based access and rate limiting.
- PostgreSQL schema and migrations for users, plans, processing jobs, transfer metadata, activity history and administrators.
- Private S3-compatible object storage with multipart/resumable uploads, expiring signed links, authorization checks and lifecycle cleanup.
- A background queue and isolated processing workers with server-side file-type/size validation and malware scanning.
- Format-appropriate PDF, office, archive, image and video processors; enforce the independent compressor and transfer limits on the server.
- Administrator-only secret storage and backend-only OpenAI API calls if AI features are enabled. ChatGPT subscriptions do not include API access or billing.
- HTTPS deployment, operational logging, monitoring, backups and security/performance testing.

No cloud, authentication, AI, or payment credentials belong in frontend code. Add environment-variable examples and migrations alongside the backend when those services are selected and implemented; this preview intentionally does not invent provider configuration or imply those systems are ready.
=======
# NEX_PDF
This website is an official site of the nex_pdf it all about converting ur document  from PDF TO WORD and many other  features in the  site
>>>>>>> 701218c56181c4c55504b45e6979003e58682b91
