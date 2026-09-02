import { defineAgent } from "eve";
import { novaModel } from "./lib/models.js";

export default defineAgent({
  model: novaModel,
});
