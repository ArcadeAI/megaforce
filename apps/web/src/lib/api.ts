import { treaty } from "@elysiajs/eden";
import { env } from "@megaforce/env/web";

import type { App } from "../../../server/src/index";

export const api = treaty<App>(env.VITE_SERVER_URL);
