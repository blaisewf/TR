// get device information from navigator
export function getDeviceInfo() {
	const ua = navigator.userAgent;
	const platform = navigator.platform;
	const language = navigator.language;
	const screenWidth = window.screen.width;
	const screenHeight = window.screen.height;
	const colorDepth = window.screen.colorDepth;
	const pixelRatio = window.devicePixelRatio;

	return {
		user_agent: ua,
		platform,
		language,
		screen_width: screenWidth,
		screen_height: screenHeight,
		color_depth: colorDepth,
		pixel_ratio: pixelRatio,
		is_mobile:
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
	};
}
