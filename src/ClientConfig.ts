export class ClientConfig {
  keepCase: boolean;
  longs: string;
  enums: string;
  defaults: boolean;
  oneofs: boolean;
  rootLocation: string;
  async: boolean;

  constructor() {
    this.keepCase = false;
    this.longs = null;
    this.enums = null;
    this.defaults = false;
    this.oneofs = false;
    this.rootLocation = null;
    this.async = true;
  }
}
