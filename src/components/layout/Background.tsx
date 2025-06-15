import type React from "react";
import { memo } from "react";

const Background: React.FC = () => {
	return (
		<div
			className="absolute inset-0 flex justify-center items-center -z-10"
			aria-hidden="true"
			style={{
				transform: "translateZ(0)",
				willChange: "transform",
			}}
		>
			<div 
				className="bg-blue-500/30 h-[70vh] w-[70vh] rounded-full"
				style={{
					filter: "blur(100px)",
					transform: "translateZ(0)",
					willChange: "transform",
				}}
			></div>
			<div 
				className="bg-blue-600/20 h-[50vh] w-[50vh] rounded-full absolute top-1/4 left-1/4"
				style={{
					filter: "blur(100px)",
					transform: "translateZ(0)",
					willChange: "transform",
				}}
			></div>
			<div 
				className="bg-blue-400/20 h-[40vh] w-[40vh] rounded-full absolute bottom-1/4 right-1/4"
				style={{
					filter: "blur(100px)",
					transform: "translateZ(0)",
					willChange: "transform",
				}}
			></div>
		</div>
	);
};

export default memo(Background);
