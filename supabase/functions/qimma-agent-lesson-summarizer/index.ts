import { handleAgent } from "../_shared/qimma-agent-runtime.ts";
Deno.serve((req:Request)=>handleAgent(req,"lesson-summarizer"));
