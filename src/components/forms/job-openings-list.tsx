"use client";

import { Briefcase, Building2, Check, Clock, FileUp, Mail, MapPin } from "lucide-react";
import * as React from "react";
import { ApplicationModal } from "@/components/forms/application-modal";
import { Button } from "@/components/ui/button";
import { mailtoHref } from "@/lib/links";
import type { Job } from "@/lib/validators/content";

export interface JobOpeningsEmptyState {
  noneHeading: string;
  noneBody: string;
  generalApplyLabel: string;
  generalRoleLabel: string;
  emailLabel: string;
}

export interface JobOpeningsListProps {
  jobs: Job[];
  contactEmail: string;
  /** Texts for the "no open positions" state, which offers a general application. */
  emptyState: JobOpeningsEmptyState;
}

export function JobOpeningsList({ jobs, contactEmail, emptyState }: JobOpeningsListProps) {
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
  // Safari and Firefox on macOS do not focus a button on click, so remember it explicitly.
  const triggerRef = React.useRef<HTMLElement | null>(null);

  return (
    <>
      {jobs.length === 0 ? (
        <div className="mx-auto mt-12 max-w-2xl rounded-card border border-border bg-surface p-12 text-center">
          <Briefcase aria-hidden="true" className="mx-auto size-12 text-muted-foreground" />
          <h3 className="mt-4 text-h3">{emptyState.noneHeading}</h3>
          <p className="mt-2 text-sm font-light text-muted-foreground">{emptyState.noneBody}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="accent"
              className="gap-2"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setSelectedRole(emptyState.generalRoleLabel);
              }}
            >
              <FileUp className="size-4" aria-hidden="true" />
              {emptyState.generalApplyLabel}
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href={mailtoHref(contactEmail, emptyState.generalRoleLabel)}>
                <Mail className="size-4" aria-hidden="true" />
                {emptyState.emailLabel}
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-12 space-y-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-card border border-border bg-surface p-8 transition-colors duration-(--duration-base) hover:border-primary/40"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3 text-label text-muted-foreground uppercase tracking-label">
                  <span className="flex items-center gap-1.5">
                    <Building2 aria-hidden="true" className="size-3.5 text-primary" />
                    {job.department}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="size-3.5 text-primary" />
                    {job.location}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden="true" className="size-3.5 text-primary" />
                    {job.type}
                  </span>
                </div>

                <h3 className="mt-4 text-h3 tracking-tight">{job.title}</h3>
                <p className="mt-3 text-sm text-foreground/80 font-light leading-relaxed">
                  {job.description}
                </p>

                <div className="mt-6">
                  <h4 className="text-label uppercase tracking-label text-muted-foreground">
                    Key Requirements:
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground font-light">
                    {job.requirements.map((req: string) => (
                      <li key={req} className="flex items-start gap-2">
                        <Check aria-hidden="true" className="size-4 text-primary shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-3 sm:w-60">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={(event) => {
                    triggerRef.current = event.currentTarget;
                    setSelectedRole(job.title);
                  }}
                  className="w-full gap-2"
                >
                  <FileUp className="size-4" aria-hidden="true" />
                  Apply with CV
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full gap-2">
                  <a href={mailtoHref(contactEmail, `Application for ${job.title} - [Your Name]`)}>
                    <Mail className="size-3.5" aria-hidden="true" />
                    Apply via Email
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ApplicationModal
        key={selectedRole || "none"}
        role={selectedRole || ""}
        isOpen={Boolean(selectedRole)}
        onClose={() => setSelectedRole(null)}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
        emailFallback={contactEmail}
      />
    </>
  );
}
