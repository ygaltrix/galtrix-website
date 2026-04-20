# GALTRIX — Built for What's Next

Official corporate website for Galtrix — a private corporation and venture platform
focused on AI, automation, digital infrastructure, and scalable ventures.

## Live site
Once GitHub Pages is enabled, the site will be available at:
`https://<your-username>.github.io/galtrix-website/`

## Project structure
```
index.html              # Main site
galtrix-logo.svg        # Full animated logo (with wordmark)
galtrix-logo-mark.svg   # Cropped animated G-mark used in header/footer
README.md
```

## Stack
- Single-file static site
- React 18 (via CDN) with in-browser Babel JSX compilation
- Tailwind CSS (via CDN)
- Custom CSS for ambient background (cyan + purple aurora, AI node graph)
- Pure SVG + SMIL for the animated logo

## Contact form
The contact form submits to Formspree:
`https://formspree.io/f/xykljbzj`

Fields: `fullName`, `email`, `project` (+ hidden `source`).

## Local preview
Just open `index.html` in a browser, or serve the folder:
```
python -m http.server 8000
```
then visit `http://localhost:8000/`.
