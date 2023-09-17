// import { trpcReact } from "../../config/trpc";
// import Box from "@mui/material/Box";
// import Select from "react-select/async";
// import { selectTheme } from "../Select/select";
// import React from "react";
// import type { SongSelectProps } from "./SongSelector";
// import type { Video } from "ytsr";
// const Search = ({ onSelect }: SongSelectProps) => {
//   const { client } = trpcReact.useContext();
//
//   return (
//     <Box sx={{ mr: 0.5, width: "100%" }}>
//       <Select<Video>
//         theme={selectTheme}
//         name={"songSearch"}
//         placeholder={"Youtube Search"}
//         blurInputOnSelect
//         isSearchable
//         cacheOptions
//         defaultOptions
//         loadOptions={(query) => client.ytSearch.query({ query })}
//         onChange={(value) => {
//           if (value) {
//             onSelect(value.url);
//           }
//         }}
//         styles={{
//           option: (baseStyles, state) => ({
//             ...baseStyles,
//             color: state.isSelected ? "white" : baseStyles.color,
//           }),
//         }}
//         getOptionLabel={(option) => option.title}
//         onBlur={() => {
//         }}
//         getOptionValue={(option) => option.url}
//       />
//     </Box>
//   );
// };
export default 0;
