import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

export const widthScale = (size: number) => scale(size);

export const heightScale = (size: number) => verticalScale(size);

export const mediumScale = (size: number, factor = 0.5) => moderateScale(size, factor);