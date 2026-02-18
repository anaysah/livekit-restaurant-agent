// lib/element-registry.ts
class ElementRegistry {
  private elements = new Map<string, HTMLElement>();

  register(id: string, element: HTMLElement | null) {
    if (element) {
      this.elements.set(id, element);
    } else {
      this.elements.delete(id);
    }
  }

  get(id: string): HTMLElement | undefined {
    return this.elements.get(id);
  }

  scrollTo(id: string) {
    const el = this.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  
  highlight(id: string) {
    const el = this.get(id);
    if (el) {
      el.classList.add("agent-highlight-ring");
      setTimeout(() => el.classList.remove("agent-highlight-ring"), 2000);
    }
  }
}

export const elementRegistry = new ElementRegistry();