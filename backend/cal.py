def calculate_calorie_intake(height_in, weight_lb, gender, age, activity_level):
    """
    Calculate daily calorie intake based on the Mifflin-St Jeor equation.
    
    Parameters:
        height_in (float): Height in inches
        weight_lb (float): Weight in pounds
        gender (str): 'male' or 'female'
        age (int): Age in years
        activity_level (str): One of ['sedentary', 'lightly active', 'moderately active', 'active', 'very active']
    
    Returns:
        float: Estimated daily calorie intake
    """
    
    # Convert weight to kilograms and height to centimeters
    weight_kg = weight_lb * 0.453592
    height_cm = height_in * 2.54

    # Calculate Basal Metabolic Rate (BMR)
    if gender.lower() == 'female':
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    elif gender.lower() == 'male':
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        raise ValueError("Gender must be 'male' or 'female'")
    
    # Define activity multipliers
    activity_multipliers = {
        'sedentary': 1.2,
        'lightly active': 1.375,
        'moderately active': 1.55,
        'active': 1.725,
        'very active': 1.9
    }
    
    # Validate activity level
    activity_level = activity_level.lower()
    if activity_level not in activity_multipliers:
        raise ValueError("Invalid activity level. Choose from: 'sedentary', 'lightly active', 'moderately active', 'active', 'very active'")
    
    # Calculate total calorie needs
    calorie_intake = bmr * activity_multipliers[activity_level]
    
    return round(calorie_intake)


def calculate_daily_calories(height_in: float, weight_lb: float, gender: str, age: int, activity_level: str) -> float:
    """
    Calculate daily calorie intake based on the Mifflin-St Jeor equation.

    This function returns an unrounded float and matches the signature expected
    by the server API.
    """
    # Convert to metric
    height_cm = height_in * 2.54
    weight_kg = weight_lb * 0.453592

    # Calculate BMR
    if gender.lower() == 'male':
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    elif gender.lower() == 'female':
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    else:
        raise ValueError("Gender must be 'male' or 'female'")

    activity_multipliers = {
        'sedentary': 1.2,
        'lightly active': 1.375,
        'moderately active': 1.55,
        'active': 1.725,
        'very active': 1.9
    }

    multiplier = activity_multipliers.get(activity_level.lower(), 1.55)
    return float(bmr * multiplier)