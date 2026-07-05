const React = require("react");
const { renderToString } = require("react-dom/server");
const { Chessboard } = require("react-chessboard");

try {
  const html = renderToString(
    React.createElement(Chessboard, {
      position: "start",
      boardWidth: 400
    })
  );
  console.log("SUCCESSFUL RENDER!");
  require("fs").writeFileSync("chessboard-render.html", html);
} catch (e) {
  console.error("RENDER FAILED:", e);
}
