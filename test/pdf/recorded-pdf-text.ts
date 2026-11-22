// Records the text a PDF report draws. With embedded fonts a PDF stores glyph
// numbers, not readable text, so tests assert on what was passed to `text()`
// instead. Use it from a `vi.mock('jspdf', ...)` factory:
//
//   vi.mock('jspdf', async (importOriginal) =>
//     (await import('@/test/pdf/recorded-pdf-text')).withRecordedText(await importOriginal())
//   );

type JsPdfModule = typeof import('jspdf');

const drawn: string[] = [];

/** Every string drawn since the last `clearRecordedPdfText()`, in order. */
export function recordedPdfText() {
  return [...drawn];
}

export function clearRecordedPdfText() {
  drawn.length = 0;
}

export function withRecordedText(actual: JsPdfModule): JsPdfModule {
  // jsPDF's constructor returns a plain object, so wrap the instance it makes.
  function RecordingJsPdf(...args: ConstructorParameters<JsPdfModule['jsPDF']>) {
    const document = new actual.jsPDF(...args);
    const text = document.text.bind(document);

    document.text = ((value: string | string[], ...rest: unknown[]) => {
      drawn.push(...(Array.isArray(value) ? value : [value]));
      return (text as (...all: unknown[]) => unknown)(value, ...rest);
    }) as typeof document.text;

    return document;
  }

  Object.assign(RecordingJsPdf, actual.jsPDF);

  return {
    ...actual,
    jsPDF: RecordingJsPdf as unknown as JsPdfModule['jsPDF'],
    default: RecordingJsPdf as unknown as JsPdfModule['default'],
  };
}
