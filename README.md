# CachyOS Nvidia Installer

A modern, user-friendly GUI application developed for CachyOS to simplify the installation and management of NVIDIA drivers.

![Screenshot](screenshot.png)

## Features

- **Automatic GPU Detection**: Instantly identifies your NVIDIA GPU model using `lspci`.
- **Driver Management**:
  - **nvidia-dkms**: Default proprietary driver (Recommended).
  - **nvidia-open-dkms**: Open-source kernel modules.
  - **nvidia-lts**: For LTS kernel users.
  - **nvidia**: Standard proprietary driver.
- **Hybrid Graphics Support**: Option to disable the specific secondary GPU (e.g., stopping Nouveau).
- **Modern UI**: Clean, responsive interface built with React and TailwindCSS.
- **Dark Mode**: Fully supported dark/light themes.

## Tech Stack

- **Electron**: Desktop runtime.
- **Vite**: Fast build tool and dev server.
- **React**: UI library.
- **TailwindCSS**: Styling.
- **TypeScript**: Type safety for both Main and Renderer processes.

## Development

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/topalemirfaruk/CachyOS-Nvidia-Installer.git
    cd CachyOS-Nvidia-Installer
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run in development mode:
    ```bash
    npm run dev
    ```

## Build

To create a production build (distributable):

```bash
npm run build
```

## License

MIT License
