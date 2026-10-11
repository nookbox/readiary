export class BookReportNotFoundError extends Error {
  constructor(readonly reportId: string) {
    super('독후감을 찾을 수 없습니다.');
    this.name = 'BookReportNotFoundError';
  }
}

export class PublishWithoutContentError extends Error {
  constructor() {
    super('본문 없이 발행할 수 없습니다.');
    this.name = 'PublishWithoutContentError';
  }
}
