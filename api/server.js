const app = require("./src/app");

const PORT = process.env.NODE_PORT || 4000;
app.listen(PORT, () => {
  console.log("Server is running on port:", PORT);
});
