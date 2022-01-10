import axios, { AxiosInstance } from 'axios';
import { aws4Interceptor } from 'aws4-axios';
import { assign, isEmpty } from 'lodash';

const singletonEnforcer = Symbol();

class AWSRequestClient {
  axiosClient: AxiosInstance;
  static axiosClientInstance: AWSRequestClient;

  constructor(enforcer: any) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot initialize Axios client single instance');
    }

    this.axiosClient = axios.create();
    const interceptor = aws4Interceptor(
      {
        region: process.env.AWS_S3_REGION,
        service: 'sagemaker',
      },
      {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    );

    this.axiosClient.interceptors.request.use(interceptor);
  }

  static get instance() {
    if (!this.axiosClientInstance) {
      this.axiosClientInstance = new AWSRequestClient(singletonEnforcer);
    }

    return this.axiosClientInstance;
  }

  get(resource: string, slug = '', config = {}) {
    const requestURL = isEmpty(slug) ? `${resource}` : `${resource}/${slug}`;
    return this.axiosClient.get(
      requestURL,
      assign(config, this.axiosClient.defaults.headers),
    );
  }

  post(resource: string, data = {}, config = {}) {
    return this.axiosClient.post(
      `${resource}`,
      data,
      assign(config, this.axiosClient.defaults.headers),
    );
  }

  update(resource: string, data = {}, config = {}) {
    return this.axiosClient.put(
      `${resource}`,
      data,
      assign(config, this.axiosClient.defaults.headers),
    );
  }

  put(resource: string, data = {}, config = {}) {
    return this.axiosClient.put(
      `${resource}`,
      data,
      assign(config, this.axiosClient.defaults.headers),
    );
  }

  patch(resource: string, data = {}, config = {}) {
    return this.axiosClient.patch(
      `${resource}`,
      data,
      assign(config, this.axiosClient.defaults.headers),
    );
  }

  delete(resource: string, data = {}, config = {}) {
    return this.axiosClient.delete(`${resource}`, {
      params: data,
      ...assign(config, this.axiosClient.defaults.headers),
    });
  }
}

export default AWSRequestClient.instance;
