import { eveChannel } from "eve/channels/eve";
import { none } from "eve/channels/auth";

export default eveChannel({
  auth: none(),
  // API pública: permite consumir el agente desde cualquier frontend web.
  cors: true,
});
