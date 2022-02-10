import * as admin from 'firebase-admin';

const singletonEnforcer = Symbol();

const serviceAccount: admin.ServiceAccount = {
  projectId: 'mammam-7ec23',
  privateKey:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD3eAjW1ob+zfmG\nsK0G/iuUTO8R+pK3/2AhV7EEKweS9aJoCwtXaZxk2cfCndqHcSMs7+e6a73CEPWM\n0bOlUXcrQFNhguaZYfzvnOOTgTWE+gWQQ0Q0sMoLY650U2zLQQ32vmwsgmcd3P1N\neoCiLxGOm+4p5w6XozTBmAfeWUzn943fBlNO0WdIXh74SyZqDIZxEDdvA/82GfJC\nE+ndDQpXvyQD5bq+oI0oCP99kXL4VA7VEHAcLS07PTVafZvOyBDDVAvU43Zz9YmS\nEV8cMjRUH47nDRgayMNtoHk/1xMABJCaXv3JoqOpQ/g1E7G6iooI7Ku7pS2Ilf0V\nQreVsgwlAgMBAAECggEABFoTibenExcLMs+rk0pn+MkrkRzfdKXkimGQ5tpc3Tw9\nmWfMUMK2Md3UkfsVqzkVncYwRIp9gUqsDshnSNp4ZoXQkY/sPzlGae5P4Dmu98Iv\n09wi+Gw9eVrM6BXJfX+M39B0dYnrh05qE/E6DuAWBnR+iTUbgBYqKNdkGAho/lFG\nzqbXjUDsPggcEbDzL5g/9xtvbDx6HnwfYSeWyxykCB0h9DsiI7uk5VV/uT+bIuZz\nAkGkSKhnE9ofvhUZZjc+tQqwmI65o7aBn+hbJU8Z8BuhG8rb9ZNYVYms1TbmpoWh\nG+54zjR+9gWXQGoetj9MfpZjAx1Fl3471SYh0JRCAQKBgQD79eiAVyBPwAt3npnx\nW1wape3exycpCmzaO0zjr+35yD0Fn/LwZayAzIGZIJ3e1ecJx0lpb0DR62cWoch5\ncPMs4YK8nvzvRzDdc16chRRpX9PSP4LjuLcpJIhjQ3MohG2jwiPNMKFbgJEBF4H6\nXen90/721269mzGfvb1v4hMZAQKBgQD7b7EMXac1TrbPYJLqFHqKz9Im+PX4DaKv\nHxtxh4qKrFkfFkvH0p2AbFKh1n39Fml8ZpgmCiy4jFIoAURMY6+XEu4nunAzx8eY\nl4n8+QTcH1+RsMPmw7yMbb4nVhPCLx259t3YJvzNbjaDm+BSGhkbuazS4NFS/fqr\n47CaSRhvJQKBgD4ujDjQR8smzC2zWK62K17wQGpQoBuC1SZuqCUxD/wrLNQsi1pE\n3XPUBM/zusJ569D/++Ancsnb3M87EizWcU1MQmWmnym2WhrtFBZwyX7QBYjH39ev\niJSAzaAhz1Paiux1RzymmcvpSOAKGyvc7ZiVL0FgHZZxrKeNvijUlH4BAoGADl8p\n/Yz028UuCdh5TUvyXTDX0EZ2uMD+xYe/p9OZhaeoSHCb0EYnnomSh5GdDfRT/zpW\nBAac28eZgpPf9YXVKYt5dWfgtfT7Yat3xa/uKS7Z5Zf2+p/BjT1Qmyr+YiETT+fe\nclZ4KL3d+9PTFJ5NRRpt2HflPxspUt3m4ErBTMkCgYEAv90TlfsTsapbI+6UTIjM\ngkgzBNVNLwTVLshWXECwjgAFWF9COFmmiMprFAdDO9umFZIa5bMMj0QtybM8kU7g\n+mDOprVJz3XNgXKsDgIPRDOFtd+4gKKIr+vsjzg3AJmdokuZ9DyJ3oECW7wfftp1\nvVZLr+0oDNsg4W4tJSJ4lb0=\n-----END PRIVATE KEY-----\n',
  clientEmail: 'firebase-adminsdk-p94c7@mammam-7ec23.iam.gserviceaccount.com',
};

class FirebaseClient {
  firebaseClient: admin.app.App;
  static firebaseClientInstance: FirebaseClient;

  constructor(enforcer: any) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot initialize Firebase client single instance');
    }

    this.firebaseClient = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  static get instance() {
    if (!this.firebaseClientInstance) {
      this.firebaseClientInstance = new FirebaseClient(singletonEnforcer);
    }

    return this.firebaseClientInstance;
  }
}

export default FirebaseClient.instance.firebaseClient;
