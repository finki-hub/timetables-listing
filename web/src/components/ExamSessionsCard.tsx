import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
} from 'lucide-react';

import type { ExamSession, ExamSessionYear } from '@/lib/sessions';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExamSessions } from '@/hooks/use-exam-sessions';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';

const fileTypeIcons = {
  pdf: FileTextIcon,
  xlsx: FileSpreadsheetIcon,
} as const;

const SessionLink = ({ session }: { session: ExamSession }) => {
  const FileIcon = fileTypeIcons[session.fileType];

  return (
    <a
      className={cn(
        buttonVariants({ size: 'sm', variant: 'outline' }),
        'h-auto gap-1.5 py-1.5',
      )}
      href={session.url}
      rel="noreferrer"
      target="_blank"
      title={`${session.name} (${session.fileType.toUpperCase()})`}
    >
      <FileIcon
        aria-hidden="true"
        className="h-3.5 w-3.5 opacity-70"
      />
      {session.label}
      <span className="text-[10px] font-semibold uppercase leading-none opacity-70">
        {session.fileType}
      </span>
    </a>
  );
};

const SessionList = ({ sessions }: { sessions: ExamSession[] }) => (
  <ul className="flex flex-wrap gap-2">
    {sessions.map((session) => (
      <li key={session.name}>
        <SessionLink session={session} />
      </li>
    ))}
  </ul>
);

const SessionsSkeleton = () => (
  <div className="space-y-6">
    {[0, 1].map((row) => (
      <div key={row}>
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((chip) => (
            <Skeleton
              className="h-8 w-36 rounded-md"
              key={chip}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SessionYears = ({ years }: { years: ExamSessionYear[] }) => (
  <div>
    {years.map((yearGroup, index) => (
      <details
        className={cn('group', index > 0 && 'mt-4 border-t pt-4')}
        key={yearGroup.year}
        open={index === 0}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-open:rotate-90"
          />
          {yearGroup.year}
          <span className="text-xs font-medium">
            ({yearGroup.sessions.length})
          </span>
        </summary>
        <div className="mt-3 pl-6">
          <SessionList sessions={yearGroup.sessions} />
        </div>
      </details>
    ))}
  </div>
);

const ExamSessionsCard = () => {
  const { error, isLoading, years } = useExamSessions();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDaysIcon
              aria-hidden="true"
              className="h-5 w-5"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">
              Испитни сесии / Колоквиумски недели
            </CardTitle>
            <CardDescription>
              Преземи распоред за испитна сесија или колоквиумска недела.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-6 pt-4 sm:px-6">
        {isLoading ? <SessionsSkeleton /> : null}
        {!isLoading && (error || years.length === 0) ? (
          <p className="text-sm text-muted-foreground">
            Листата на сесии моментално не е достапна.
          </p>
        ) : null}
        {!isLoading && !error && years.length > 0 ? (
          <SessionYears years={years} />
        ) : null}
      </CardContent>
    </Card>
  );
};

export { ExamSessionsCard };
