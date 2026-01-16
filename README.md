# Minecraft Daltonizer Suite

> **Note:** This project is Free Software licensed under GPLv3.

**Minecraft Daltonizer Suite** is a client-side web application designed to improve accessibility for Minecraft players with color blindness. 

It processes Resource Packs (`.zip` files) by automatically applying color correction (Daltonization) and assistive overlays to ensure that key gameplay elements (like Ores, Potions, and Wool) are distinguishable regardless of the user's vision deficiency.

![Screenshot](public/screenshot.png) *(Preview placeholder)*

## Features

### 🎨 Color Processing
- **Simulation Mode:** Visualize how the resource pack looks to someone with a specific type of color blindness.
- **Daltonization Mode:** Automatically shifts colors to move them from "invisible" confusion lines to the visible spectrum for the selected condition.
- **Supported Profiles:**
  - **Protanopia** (Red-Blind)
  - **Deuteranopia** (Green-Blind)
  - **Tritanopia** (Blue-Blind)
  - **Achromatopsia** (Monochromacy)

### 🧩 Smart Overlays
For textures where color shifting isn't enough (like similar-looking ores), the suite injects high-contrast vector overlays directly into the texture:
- **Ores:** Adds chemical symbols (e.g., 'Fe', 'Au', 'Di') or borders.
- **Wool/Terracota:** Adds letter indicators (R, G, B...).
- **Potions:** Adds distinct icons for effects (Strength, Speed, etc.).

### ⚡ Performance
- **Client-Side Only:** No files are uploaded to any server. Privacy is guaranteed.
- **Web Workers:** Heavy image processing happens on background threads, ensuring the UI never freezes, even with 100MB+ packs.
- **Drag & Drop:** Simple ingest interface.

## Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Zip Handling:** JSZip + FileSaver
- **Icons:** Lucide React

## Installation & Development

This project uses `npm` for dependency management.

```bash
# Clone the repository
git clone https://github.com/yourusername/minecraft-daltonizer-suite.git

# Enter directory
cd minecraft-daltonizer-suite

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5009` (default).

## License

This project is licensed under the **GNU General Public License v3.0**. 
See the [LICENSE](LICENSE) file for details.

You are free to run, copy, distribute, study, change, and improve the software.
