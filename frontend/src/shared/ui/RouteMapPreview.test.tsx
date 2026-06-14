import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/i18n";
import { RouteMapPreview } from "./RouteMapPreview";

describe("RouteMapPreview", () => {
  it("renders selected route details", () => {
    render(
      <LanguageProvider>
        <RouteMapPreview
          from="Yekaterinburg"
          to="Tyumen"
          distanceKm={330}
          durationMinutes={260}
          capacityLabel="18 seats available"
        />
      </LanguageProvider>
    );

    expect(screen.getByRole("img", { name: "Route from Yekaterinburg to Tyumen" })).toBeInTheDocument();
    expect(screen.getByText("Yekaterinburg")).toBeInTheDocument();
    expect(screen.getByText("Tyumen")).toBeInTheDocument();
    expect(screen.getByText("330 km")).toBeInTheDocument();
    expect(screen.getByText("4h 20m")).toBeInTheDocument();
    expect(screen.getByText("18 seats available")).toBeInTheDocument();
  });

  it("renders empty route state", () => {
    render(
      <LanguageProvider>
        <RouteMapPreview from="" to="" />
      </LanguageProvider>
    );

    expect(screen.getByText("Choose a route to preview distance and capacity.")).toBeInTheDocument();
  });
});
