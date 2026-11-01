"use client";

import { Building2, Check, Clock, FileUp, Mail, MapPin } from "lucide-react";
import * as React from "react";
import { ApplicationModal } from "@/components/forms/application-modal";
import { Button } from "@/components/ui/button";
import { mailtoHref } from "@/lib/links";
import type { Job } from "@/lib/validators/content";

export interface JobOpeningsListProps {
  jobs: Job[];
  contactEmail: string;
}

export function JobOpeningsList({ jobs, contactEmail }: JobOpeningsListProps) {
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);

  return (
    <>
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
                  onClick={() => setSelectedRole(job.title)}
                  className="w-full gap-2"
                >
                  <FileUp className="size-4" aria-hidden="true" />
                  Apply with CV
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full gap-2">
                  <a
                    href={mailtoHref(
                      contactEmail,
                      `Application for ${job.title} - [Your Name]`,
                    )}
                  >
                    <Mail className="size-3.5" aria-hidden="true" />
                    Apply via Email
                  </a>
                </Button>
                <span className="text-sm text-muted-foreground text-center">
                  Direct submission to HR panel
                </span>
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
        emailFallback={contactEmail}
      />
    </>
  );
}
