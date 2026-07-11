interface WorkerEnv {
  ASSETS: Fetcher;
}

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
