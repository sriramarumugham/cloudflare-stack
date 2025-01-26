# Cloudflare stack

## Index

- [Vite Cloudflare Pages Boilerplate](#vite-cloudflare-pages-boilerplate)
- [Project Structure](#project-structure)
- [Features](#features)
- [Deployment Process](#deployment-process)
- [Notes](#notes)
- [Resources](#resources)
- [License](#license)

# Vite Cloudflare Pages Boilerplate

This repository contains a basic setup to deploy a Vite application to Cloudflare Pages. The deployment is automated through Git, and any push to the `master` branch triggers an automatic deployment.

## Project Structure

```
/vite-cloudflare-pages
├── public          # Static assets
├── src             # Main application code
├── index.html      # Entry point for the Vite app
├── package.json    # Dependencies and scripts
├── vite.config.js  # Vite configuration
└── README.md       # Project documentation
```

## Features

- **Vite Setup**: A pre-configured Vite template.
- **Cloudflare Pages Deployment**: Seamless deployment via Git integration.
- **No Wrangler Configuration Required**: Deployment does not require a `wrangler.toml` file.

## Deployment Process

1. Clone this repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd vite-cloudflare-pages
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Push changes to the `master` branch to trigger an automatic deployment to Cloudflare Pages.

## Notes

- Ensure your repository is linked to Cloudflare Pages for automated deployment.
- Any push to the `master` branch will trigger an automatic build and deployment.
- Since no `wrangler.toml` file is required, configurations specific to Workers are not included in this setup.

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

## License

This project is licensed under the MIT License.
