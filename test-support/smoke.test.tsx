import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("jsdom + Testing Library funcionan", () => {
  render(<p>hola</p>);
  expect(screen.getByText("hola")).toBeInTheDocument();
});
