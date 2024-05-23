export class NewRelicEventDTO {
  eventType: string;
  attributes: Map<string, string>;

  constructor(type: string, attributes: Map<string, string>) {
    this.eventType = type;
    this.attributes = attributes;
  }

  toJSON() {
    const mapObject = Object.fromEntries(this.attributes);
    return {
      eventType: this.eventType,
      attributes: mapObject,
    };
  }
}
