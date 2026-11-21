type AuthErrorCalloutProps = {
  leadIn: string;
  messages: string[];
};

export function AuthErrorCallout({ leadIn, messages }: AuthErrorCalloutProps) {
  return (
    <div
      role="alert"
      className="animate-in fade-in slide-in-from-top-1 border-destructive/20 bg-destructive/5 relative rounded-xl border py-3 pr-4 pl-6 text-sm duration-300 ease-out motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="bg-destructive absolute inset-y-2.5 left-2 w-1 rounded-full"
      />
      {messages.length === 1 ? (
        <p className="text-foreground">
          <span className="font-semibold">{leadIn}</span> {messages[0]}
        </p>
      ) : (
        <>
          <p className="text-foreground font-semibold">{leadIn}</p>
          <ul className="text-foreground mt-1 list-disc space-y-1 pl-4">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
