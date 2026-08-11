// Full shim for @supabase/functions-js
// Provides all exports that @supabase/supabase-js expects but the installed
// version of @supabase/functions-js does not export.

export enum FunctionRegion {
  Any = 'any',
  ApNortheast1 = 'ap-northeast-1',
  ApNortheast2 = 'ap-northeast-2',
  ApSouth1 = 'ap-south-1',
  ApSoutheast1 = 'ap-southeast-1',
  ApSoutheast2 = 'ap-southeast-2',
  CaCentral1 = 'ca-central-1',
  EuCentral1 = 'eu-central-1',
  EuWest1 = 'eu-west-1',
  EuWest2 = 'eu-west-2',
  EuWest3 = 'eu-west-3',
  SaEast1 = 'sa-east-1',
  UsEast1 = 'us-east-1',
  UsWest1 = 'us-west-1',
  UsWest2 = 'us-west-2',
}

export class FunctionsError extends Error {
  context: unknown;
  constructor(message: string, name = 'FunctionsError', context?: unknown) {
    super(message);
    this.name = name;
    this.context = context;
  }
}

export class FunctionsFetchError extends FunctionsError {
  constructor(context: unknown) {
    super('Failed to send a request to the Edge Function', 'FunctionsFetchError', context);
  }
}

export class FunctionsHttpError extends FunctionsError {
  constructor(context: unknown) {
    super('Edge Function returned a non-2xx status code', 'FunctionsHttpError', context);
  }
}

export class FunctionsRelayError extends FunctionsError {
  constructor(context: unknown) {
    super('Relay error invoking the Edge Function', 'FunctionsRelayError', context);
  }
}

export class FunctionsClient {
  protected url: string;
  protected headers: Record<string, string>;

  constructor(url: string, options?: { headers?: Record<string, string> }) {
    this.url = url;
    this.headers = options?.headers ?? {};
  }

  setAuth(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  async invoke<T = unknown>(
    functionName: string,
    options?: {
      headers?: Record<string, string>;
      body?: unknown;
      method?: string;
      region?: FunctionRegion;
    }
  ): Promise<{ data: T | null; error: FunctionsError | null }> {
    const method = options?.method ?? (options?.body ? 'POST' : 'GET');
    const headers: Record<string, string> = { ...this.headers, ...options?.headers };

    let body: BodyInit | undefined;
    if (options?.body instanceof FormData || options?.body instanceof Blob ||
        options?.body instanceof ArrayBuffer) {
      body = options.body as BodyInit;
    } else if (options?.body !== undefined) {
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${this.url}/${functionName}`, { method, headers, body });
      if (!response.ok) {
        return { data: null, error: new FunctionsHttpError(response) };
      }
      const data = await response.json() as T;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: new FunctionsFetchError(e) };
    }
  }
}
