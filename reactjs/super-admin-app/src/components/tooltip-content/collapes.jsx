
import { Link } from "react-router-dom";
import { useState } from "react";
import { Tooltip } from "primereact/tooltip";

const CollapesIcon = () => {
  const [toggleHeader, setToggleHeader] = useState(false);
  const handleToggleHeader = () => {
    setToggleHeader(!toggleHeader);
  };
  return (
    <li className="collapse-icons">
       <Tooltip target=".pr-tooltip" />
        <Link
        to="#"
        className="pr-tooltip"
        data-pr-tooltip="Collapse"
        data-pr-position="top"
        id="collapse-header"
        onClick={handleToggleHeader}>
        
          <i
          className={`ti  ${toggleHeader ? "ti-chevron-down" : "ti-chevron-up"}`} />
        
        </Link>
    </li>);

};

export default CollapesIcon;