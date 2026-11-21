import { Button } from '@/components/ui/button';

type LoadErrorProps = {
  message: string;
  onRetry: () => void;
};

const LoadError = ({ message, onRetry }: LoadErrorProps) => (
  <div
    className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
    role="alert"
  >
    <h3 className="text-lg font-semibold text-destructive">
      Не може да се вчитаат податоците
    </h3>
    <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    <Button
      className="mt-3"
      onClick={onRetry}
      size="sm"
      type="button"
      variant="outline"
    >
      Обиди се повторно
    </Button>
  </div>
);

export { LoadError };
