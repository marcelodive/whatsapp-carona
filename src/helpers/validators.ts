import validator from 'validator';

export type ValidationReturn = {
  isValid: boolean,
  errorMessage: string,
}

export const isFullName = (string: string): ValidationReturn => {
  const isMoreThanTwoWords = string?.split(' ').length > 1;
  return {
    isValid: isMoreThanTwoWords,
    errorMessage: 'Por favor, insira um nome válido e completo.'
  };
};

export const isValidCEP = (string: string): ValidationReturn => {
  const isOnlyNumbers = validator.isNumeric(string);
  const isCorrectLength = string.length === 8;
  return {
    isValid: isOnlyNumbers && isCorrectLength,
    errorMessage: 'Por favor, insira um CEP válido (apenas números).'
  }
}

export const isNumberBetween1and5 = (string: string): ValidationReturn => {
  const isNumbericString = validator.isNumeric(string);
  const number = Number(string);
  const isBetween1and5 = ((number >= 1) && (number <= 5))

  return {
    isValid: isNumbericString && isBetween1and5,
    errorMessage: 'Por favor, insira um número entre 1 e 5.',
  }
}