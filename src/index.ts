import { app } from "./server";

app.listen(3000, () => {
  console.log("Server listening on port 3000");
  console.log(`worker-pid ${process.pid}`);
});
