import { mountApp } from "@web-core/solid/mount";

import { Counter } from "./counter";
import { Globbed } from "./globbed";

mountApp(() => (
  <>
    <Counter />
    <Globbed />
  </>
));
