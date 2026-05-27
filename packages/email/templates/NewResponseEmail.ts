import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

export type NewResponseEmailProps = {
  formTitle: string;
  formSlug: string;
  responseId: string;
  submittedAtIso: string;
  answerCount: number;
};

export function NewResponseEmail(props: NewResponseEmailProps) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `New response for ${props.formTitle}`),
    React.createElement(
      Body,
      { style: { fontFamily: "Arial, sans-serif", backgroundColor: "#f6f9fc", padding: "24px" } },
      React.createElement(
        Container,
        { style: { backgroundColor: "#ffffff", borderRadius: "8px", padding: "24px" } },
        React.createElement(
          Section,
          null,
          React.createElement(
            Text,
            { style: { fontSize: "20px", fontWeight: "700", marginBottom: "8px" } },
            "New response received",
          ),
          React.createElement(Text, { style: { margin: "0 0 6px 0" } }, `Form: ${props.formTitle}`),
          React.createElement(Text, { style: { margin: "0 0 6px 0" } }, `Slug: ${props.formSlug}`),
          React.createElement(
            Text,
            { style: { margin: "0 0 6px 0" } },
            `Response ID: ${props.responseId}`,
          ),
          React.createElement(
            Text,
            { style: { margin: "0 0 6px 0" } },
            `Submitted at: ${props.submittedAtIso}`,
          ),
          React.createElement(
            Text,
            { style: { margin: 0 } },
            `Captured answers: ${props.answerCount}`,
          ),
        ),
      ),
    ),
  );
}
