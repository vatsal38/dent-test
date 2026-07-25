export const BOB_SUBMISSION_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export function bobSubmissionAttachmentMaxLabel() {
  return `${BOB_SUBMISSION_ATTACHMENT_MAX_BYTES / (1024 * 1024)}MB`;
}

export function fileExceedsBobAttachmentLimit(file: File) {
  return file.size > BOB_SUBMISSION_ATTACHMENT_MAX_BYTES;
}
