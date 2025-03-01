import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";

import ParticleConnections from "@/components/particleConnections";
import { title, subtitle } from "@/components/primitives";

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
          <span className={title()}>with RAG-Ready</span>
          <div className={subtitle({ class: "mt-4" })}>
            Protect against poisoning & hallucinations.
          </div>
        </div>

        <div className="mt-8">
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <span>
              Get started by editing <Code color="primary">app/page.tsx</Code>
            </span>
          </Snippet>
        </div>
      </section>
    </>
  );
}
