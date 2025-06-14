import type React from "react";

const Background: React.FC = () => {
	return (
		<div
			className="absolute inset-0 flex justify-center items-center -z-10"
			aria-hidden="true"
		>
			<div className="bg-blue-500/30 h-[70vh] w-[70vh] rounded-full blur-[150px]"></div>
			<div className="bg-blue-600/20 h-[50vh] w-[50vh] rounded-full blur-[150px] absolute top-1/4 left-1/4"></div>
			<div className="bg-blue-400/20 h-[40vh] w-[40vh] rounded-full blur-[150px] absolute bottom-1/4 right-1/4"></div>
		</div>
	);
};

export default Background;
