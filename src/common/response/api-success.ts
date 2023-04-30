export class ApiSuccessResponse<T> {
  public message: string;

  public data: T;

  public async success(data?: T, message?: string) {
    this.message = message || '';
    this.data = data;

    return this;
  }
}
