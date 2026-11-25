# Lapbook Maker

A browser-based editor for designing digital lapbooks with interactive flaps, accordion folds, mini booklets, pockets, spinning wheels, tabs, and decorative paper shapes.

## Features

- Arrange elements freely on a three-panel lapbook canvas.
- Add and customize foldable elements and geometric paper shapes.
- Edit text, colors, dimensions, and rotation.
- Drag elements, change their layer order, duplicate, and delete them.
- Preview interactive flaps, booklets, pockets, accordions, and spinning wheels.
- Automatically save the current project in the browser's local storage.
- Export and import projects as JSON files.
- Print the canvas or save it as a PDF using the browser's print dialog.

## Run locally

No build step or dependencies are required. Open \`index.html\` in a modern browser, or serve the folder with any static web server.

## GitHub Pages

This repository is a static website. In GitHub, open **Settings → Pages**, select the \`main\` branch and the root folder, and save. GitHub Pages will publish \`index.html\`.

## Storage

Projects are saved in the browser on the current device. Use **Exportieren** to keep a portable backup or move a project to another browser.


## Lapbook-template catalog

The editor includes the paper constructions from the RESTLOS GLÜCKLICH / Sarah Wiener Stiftung worksheet catalog: flower fold, four-card pocket, two fan styles, accordion leporello, folding cross, tri-fold sheet, hexagon fold, figure leporello, flip-flap, and folding heart. The spinning wheel has four editable segments.

Each construction can be edited on the canvas. Use the fold controls or individual panels to preview how it opens. The **Linien** control switches construction guides on and off; the print view keeps cut, fold, and glue guides visible.

Reference worksheet: [Meinem Schulessen auf der Spur – Lapbook-Kopiervorlagen](https://www.restlos-gluecklich.berlin/wp-content/uploads/2021/08/MeinemSchulessenaufderSpur_Lapbook_Kopiervorlagen_V2.pdf).

### Individual panel editing

Multi-part elements show a separate text field for every panel in the sidebar. Use **＋ Teil hinzufügen** to add up to 12 panels, or **−** beside a panel to remove one. The minimum number depends on the construction. Panel text is saved with the project and included in JSON exports.

For single foldable elements, the front and inside/card text also have separate fields. The flower automatically matches its center polygon's number of corners to its petal count. Disable **Seitenzahl an Blütenblätter koppeln** to choose the number manually (3–12).

All elements share the same controls for colors, width, height, X/Y position, rotation, duplication, deletion, and layer order. Dragging an element also updates its numeric position fields. Zoom affects the working view only; printing uses the full lapbook canvas and includes the construction guides.
