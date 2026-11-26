# Lapbook Maker

A browser-based editor for designing digital lapbooks with interactive flaps, accordion folds, mini booklets, pockets, spinning wheels, tabs, and decorative paper shapes. Only supports German at the moment. 

## Features

- Arrange elements freely on a three-panel lapbook canvas.
- Add and customize foldable elements and geometric paper shapes.
- Edit text, colors, dimensions, and rotation.
- Drag elements, change their layer order, duplicate, and delete them.
- Preview interactive flaps, booklets, pockets, accordions, and spinning wheels.
- Automatically save the current project in the browser's local storage.
- Export and import projects as JSON files.

## GitHub Pages

This repository is a static website. In GitHub, open **Settings → Pages**, select the \`main\` branch and the root folder, and save. GitHub Pages will publish \`index.html\`.

## Storage

Projects are saved in the browser on the current device. Use **Exportieren** to keep a portable backup or move a project to another browser.

### Individual panel editing

Multi-part elements show a separate text field for every panel in the sidebar. Use **＋ Teil hinzufügen** to add up to 12 panels, or **−** beside a panel to remove one. The minimum number depends on the construction. Panel text is saved with the project and included in JSON exports.

For single foldable elements, the front and inside/card text also have separate fields. The flower automatically matches its center polygon's number of corners to its petal count. Disable **Seitenzahl an Blütenblätter koppeln** to choose the number manually (3–12).

All elements share the same controls for colors, width, height, X/Y position, rotation, duplication, deletion, and layer order. Dragging an element also updates its numeric position fields. Zoom changes the view only.
