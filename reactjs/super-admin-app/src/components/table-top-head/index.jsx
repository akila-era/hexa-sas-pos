import { excel, pdf } from "../../utils/imagepath";
import { Link } from "react-router";
import { Tooltip } from "primereact/tooltip";
import { useState } from "react";

const TableTopHead = () => {
  const [toggleHeader, setToggleHeader] = useState(false);
  const handleToggleHeader = () => {
    setToggleHeader(!toggleHeader);
  };
  return (
    <>
      <Tooltip target=".pr-tooltip" />
      <ul className="table-top-head">
        <li>
          <Link
            to="#"
            className="pr-tooltip"
            data-pr-tooltip="Pdf"
            data-pr-position="top">
            
            <img src={pdf} alt="img" />
          </Link>
        </li>
        <li>
          <Link
            to="#"
            className="pr-tooltip"
            data-pr-tooltip="Excel"
            data-pr-position="top">
            
            <img src={excel} alt="img" />
          </Link>
        </li>
        <li>
          <Link
            to="#"
            className="pr-tooltip"
            data-pr-tooltip="Refresh"
            data-pr-position="top">
            
            <i className="ti ti-refresh" />
          </Link>
        </li>
        <li>
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
        </li>
      </ul>
    </>);

};

export default TableTopHead;