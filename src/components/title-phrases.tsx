import { Fragment } from "react";

export function TitlePhrases({ phrases }: { phrases: readonly string[] }) {
  return phrases.map((phrase, index) => <Fragment key={index}>
    {index > 0 && <wbr />}
    <span className="title-phrase">{phrase}</span>
  </Fragment>);
}
