import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";

import ParticleConnections from "@/components/particleConnections";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <ParticleConnections className="absolute inset-0 z-0" />
      <section className="relative z-10 flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-xl justify-center text-center">
          <span className={title()}>Make your&nbsp;</span>
          <span className={title()}>RAG&nbsp;</span>
          <br />
          <span className={title()}>tools worth&nbsp;</span>
          <span className={title({ color: "violet" })}>trusting</span>
          <br />
          <span className={title()}>with the RAG-Ready API</span>
          <div className={subtitle({ class: "mt-4" })}>
            Protect your systems against <Code color="secondary">poisoning & hallucinations</Code>
          </div>
        </div>

        <Link className="mt-16" href="/AugmentedChat">
          <Button color="secondary" className="h-14 w-fit text-lg font-light" variant="shadow">
            See it in action
            <Icon className="text-lg" icon="heroicons:arrow-right" />
          </Button>
        </Link>
      </section>
    </>
  );
}
