import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

export type RespondentThankYouEmailProps = {
  formTitle: string;
  formSlug: string;
};

export function RespondentThankYouEmail(props: RespondentThankYouEmailProps) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Thanks for your response to ${props.formTitle}`),
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
            "Thanks for responding",
          ),
          React.createElement(
            Text,
            { style: { margin: "0 0 6px 0" } },
            `We received your submission for ${props.formTitle}.`,
          ),
          React.createElement(
            Text,
            { style: { margin: 0 } },
            `You can revisit the form at /f/${props.formSlug}.`,
          ),
        ),
      ),
    ),
  );
}
